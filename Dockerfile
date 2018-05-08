FROM centos:centos7
MAINTAINER puterjam

RUN yum -y update; yum clean all
RUN yum -y install epel-release; yum clean all
RUN yum -y install nodejs npm; yum clean all

ADD . /src
ADD ./wwwroot /wwwroot
RUN cd /src; npm install

EXPOSE 8080

CMD ["node", "/src/index.js"]